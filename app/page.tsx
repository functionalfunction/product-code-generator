"use client";
import React, { useEffect, useState } from "react";
import * as CSVParser from "papaparse";
import Select from "react-dropdown-select";

export default function CSVProcessor() {
  const [familyList, setFamilyList] = useState([]);
  const [filterOptions, setFilterOptions] = useState({}) as any;
  const [attributeList, setAttributeList] = useState([]);
  const [productList, setProductList] = useState<string[]>([]);
  const [filteredProductList, setFilteredProductList] = useState<string[]>([]);
  const [errorList, setErrorList] = useState<string[]>([]);

  const handleFamilyListDownloadSample = (e: any) => {
    const link = document.createElement("a");
    link.href = "/Family-List.csv";
    link.download = "Family-List.csv";
    document.body.appendChild(link);
    link.click();
  }

  const handleAttributeListDownloadSample = (e: any) => {
    const link = document.createElement("a");
    link.href = "/List-Attributes.csv";
    link.download = "List-Attributes.csv";
    document.body.appendChild(link);
    link.click();
  }

  const handleFamilyList = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const csvText = event.target.result;
        CSVParser.parse(csvText, {
          header: true,
          complete: (results: any) => {
            setFamilyList(results.data);
          },
          error: (error: any) => {
            setErrorList(["Family list is empty"]);
          },
        });
      };
      reader.readAsText(file);
    }
  };

  const handleAttributeList = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const csvText = event.target.result;
        CSVParser.parse(csvText, {
          header: true,
          complete: (results: any) => {
            setAttributeList(results.data);
          },
          error: (error: any) => {
            setErrorList(["Attribute list is empty"]);
          },
        });
      };
      reader.readAsText(file);
    }
  };

  const seperateMultipleAttributes = (family: any) => {
    const multipleAttributes = {} as any;
    Object.keys(family).forEach((familyKey) => {
      if (
        family[familyKey] &&
        family[familyKey].split(",").length > 1
      ) {
        multipleAttributes[familyKey] = multipleAttributes[familyKey] || [];
        family[familyKey].split(",").forEach((attribute: any) => {
          multipleAttributes[familyKey].push(attribute);
        });
      }
    })
    return multipleAttributes
  }

  const handleGenerateProductList = (e: any) => {
    if (familyList.length === 0 || attributeList.length === 0) {
      setErrorList(["Family list or attribute list is empty"]);
      return;
    }
    const productMapping = {} as any;
    let products = [] as any[];
    let tempErrorList = [] as any[];

    attributeList.forEach((attribute: any) => {
      const type = attribute.Type;
      if (!productMapping[type]) {
        productMapping[type] = [];
      }
      productMapping[type].push(attribute);
    });

    familyList.forEach((family: any) => {
      let updatedFamily = { "Product Reference": "", "Product Name": family["Category Name"], ...family };

      let multipleAttributes = seperateMultipleAttributes(updatedFamily);

      let attributeKeys = Object.keys(multipleAttributes);

      function generateProducts(index: number, product: any) {
        if (index === attributeKeys.length) {
          setProductCodeAndName(product);
          products.push(product);
          return;
        }

        let key = attributeKeys[index];
        for (let i = 0; i < multipleAttributes[key].length; i++) {
          let newProduct = { ...product };
          newProduct[key] = multipleAttributes[key][i];
          generateProducts(index + 1, newProduct);
        }
      }

      function generateProductsWithoutMultipleAttributes() {
        let product = { ...updatedFamily };
        attributeKeys.forEach((key) => {
          product[key] = multipleAttributes[key][0];
        });
        setProductCodeAndName(product);
        products.push(product);
      }

      function setProductCodeAndName(product: any) {
        Object.keys(product).forEach((key) => {
          debugger
          if (productMapping[key]) {
            debugger
            if (attributeList.filter(
              (attribute: any) =>
                attribute.Reference === product[key] &&
                attribute.Type === key).length == 0 && product[key]) {
              tempErrorList.push("Attribute not found for " + key + ": " + product[key]);
            } else if (product["Product Reference"] == "" && product[key]) {
              debugger
              product["Product Reference"] = product[key];
              if (attributeList.find(
                (attribute: any) => attribute.Reference === product[key] &&
                  attribute.Type === key
              )) {
                product["Product Name"] = (attributeList.find(
                  (attribute: any) => attribute.Reference === product[key] &&
                    attribute.Type === key
                ) as any).Name;
              }
            } else if (product[key]) {
              debugger
              product["Product Reference"] = product["Product Reference"] + "-" + product[key];
              if (attributeList.find(
                (attribute: any) => attribute.Reference === product[key] &&
                  attribute.Type === key
              )) {
                debugger
                product["Product Name"] = product["Product Name"] + " - " + (attributeList.find(
                  (attribute: any) => attribute.Reference === product[key] &&
                    attribute.Type === key
                ) as any).Name;
              }
            }
          }
        })
      }

      generateProducts(0, updatedFamily);
    });
    if (tempErrorList.length > 0) {
      const uniqueErrorList = tempErrorList.reduce((acc, currentValue) => {
        if (!acc.includes(currentValue)) {
          acc.push(currentValue);
        }
        return acc;
      }, []);
      setErrorList(uniqueErrorList);
    } else {
      setErrorList([]);
    }

    setProductList(products);
  };

  const handleClearAllFilters = () => {
    setFilterOptions({});
    setFilteredProductList([]);
  }


  const handleProductMappingChange = (value: any, key: any) => {
    if (value.length === 0) {
      const tempFilterOptions = { ...filterOptions };
      delete tempFilterOptions[key];
      setFilterOptions(tempFilterOptions);
    } else {
      const tempFilterOptions = { ...filterOptions };
      tempFilterOptions[key] = value.map((option: any) => option.label);
      setFilterOptions(tempFilterOptions);
    }
  }

  const filterProducts = (products: any, key: any, filters: any) => {
    return products.filter((product: any) => {
      if (filters.length === 0) {
        return true;
      }
      if (filters.includes(product[key])) {
        return true;
      }
      return false;
    })
  };

  useEffect(() => {
    let filteredProducts = productList;
    Object.keys(filterOptions).forEach((key) => {
      filteredProducts = filterProducts(filteredProducts, key, filterOptions[key]);
    })
    setFilteredProductList(filteredProducts);
  }, [filterOptions, productList]);

  const exportCSV = (e: any) => {
    if (productList.length === 0) {
      setErrorList(["Product list is empty"]);
      return;
    }
    let _productList = productList;
    if (filteredProductList.length > 0) {
      _productList = filteredProductList;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += Object.keys(_productList[0]).join(",") + "\n";
    csvContent += _productList.map((row: any) => Object.values(row).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products.csv");
    document.body.appendChild(link);
    link.click();
  }

  return (
    <main>
      <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Product Code Generator
        </h1>
        <p className="text-sm text-gray-500">
          Generate product codes based on family list and attribute list
        </p>
      </div>
      <div className="flex flex-row gap-4 px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 bg-gray-100 rounded-lg shadow-lg p-4">
        <div className="flex flex-col gap-2">
          <label className="text-lg font-bold">Family List</label>
          <input
            type="file"
            onChange={handleFamilyList}
            accept=".csv"
            className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
          />
          <p className="text-sm text-gray-500">
            Only CSV files are supported
            <br />
            <button className="text-blue-500" onClick={handleFamilyListDownloadSample}>Download sample</button>
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-lg font-bold">Attribute List</label>
          <input
            type="file"
            onChange={handleAttributeList}
            accept=".csv"
            className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
          />
          <p className="text-sm text-gray-500">
            Only CSV files are supported
            <br />
            <button className="text-blue-500" onClick={handleAttributeListDownloadSample}>
              Download sample
            </button>
          </p>
        </div>
      </div>

      {errorList.length > 0 && <div className="flex flex-col gap-4 px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 bg-red-100 rounded-lg shadow-lg p-4">
        {(
          errorList.map((error: any, index: any) => (
            <p className="text-red-500" key={index}>{error}</p>
          ))
        )}
      </div>}

      <div className="flex flex-row gap-4 px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 bg-gray-100 rounded-lg shadow-lg p-4">
        <button onClick={handleGenerateProductList} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Generate Product List
        </button>
        <button onClick={exportCSV} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Export CSV
        </button>
      </div>

      <div className="flex flex-row gap-4 px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 bg-gray-100 rounded-lg shadow-lg p-4 overflow-x-auto">
        {productList.length > 0 && (
          <table className="table min-w-full divide-y divide-gray-200 border border-gray-200 rounded shadow bg-white border-collapse">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                {Object.keys(productList[0]).map((key: any) => (
                  <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                    {key !== "Product Reference" && key != "Product Name" ? <Select options={productList
                      .reduce((acc: any, product: any) => {
                        if (!acc.includes(product[key])) {
                          acc.push(product[key]);
                        }
                        return acc;
                      }, [])
                      .map((product: any) => {
                        return {
                          label: product,
                          value: key + "," + product
                        }
                      })}
                      onChange={(value) => handleProductMappingChange(value, key)}
                      onClearAll={handleClearAllFilters}
                      values={filterOptions[key]}
                      multi={true}
                    /> : <></>}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-gray-200">
                {Object.keys(productList[0]).map((key) => (
                  <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProductList.length > 0 ? filteredProductList.map((row, index) => (
                <tr key={index} className="border-b border-gray-200">
                  {Object.values(row).map((value, index) => (
                    <td key={index} className="px-6 py-4 whitespace-nowrap">
                      {value}
                    </td>
                  ))}
                </tr>
              )) : productList.map((row, index) => (
                <tr key={index} className="border-b border-gray-200">
                  {Object.values(row).map((value, index) => (
                    <td key={index} className="px-6 py-4 whitespace-nowrap">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
